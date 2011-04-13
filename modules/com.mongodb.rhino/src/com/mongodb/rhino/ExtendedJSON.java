/**
 * Copyright 2010-2011 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package com.mongodb.rhino;

import java.util.Date;
import java.util.HashMap;
import java.util.regex.Pattern;

import org.bson.types.Binary;
import org.bson.types.ObjectId;
import org.mozilla.javascript.NativeJavaObject;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.regexp.NativeRegExp;

import com.mongodb.DBRefBase;
import com.mongodb.rhino.util.Base64;
import com.mongodb.rhino.util.NativeRhino;

/**
 * Support for <a
 * href="http://www.mongodb.org/display/DOCS/Mongo+Extended+JSON">MongoDB's
 * extended JSON format</a>.
 * 
 * @author Tal Liron
 */
public class ExtendedJSON
{
	//
	// Static operations
	//

	/**
	 * Converts JavaScript objects adhering to MongoDB's extended JSON to
	 * JavaScript and BSON types.
	 * <p>
	 * BSON types: {$oid:'objectid'}, {$binary:'base64',$type:'hex'}, and
	 * {$ref:'collection',$id:'objectid'}.
	 * <p>
	 * The {$date:timestamp} extended JSON format can be converted to either a
	 * JavaScript Date object or a java.util.Date object, according to the
	 * javaScript argument.
	 * <p>
	 * The {$regex:'pattern',$options:'options'} extended JSON format is
	 * converted to a JavaScript RegExp object.
	 * <p>
	 * The {$long:'integer'} extended JSON format is converted to a
	 * java.lang.Long object.
	 * 
	 * @param scriptable
	 *        The JavaScript object
	 * @param javaScript
	 *        True to convert the $date format to a JavaScript Date, otherwise
	 *        it will be converted to a java.util.Date
	 * @return A BSON object, a java.util.Date, a JavaScript Date or null
	 */
	public static Object from( ScriptableObject scriptable, boolean javaScript )
	{
		Object longValue = getProperty( scriptable, "$long" );
		if( longValue != null )
		{
			// Convert extended JSON $long format to Long

			if( longValue instanceof Number )
				return NativeRhino.wrap( ( (Number) longValue ).longValue() );
			else
			{
				try
				{
					return NativeRhino.wrap( Long.parseLong( longValue.toString() ) );
				}
				catch( NumberFormatException x )
				{
					throw new RuntimeException( "Invalid $long: " + longValue );
				}
			}
		}

		Object dateValue = getProperty( scriptable, "$date" );
		if( dateValue != null )
		{
			// Convert extended JSON $date format to Rhino/JVM date

			long dateTimestamp;

			if( dateValue instanceof Number )
				dateTimestamp = ( (Number) dateValue ).longValue();
			else if( dateValue instanceof ScriptableObject )
			{
				longValue = getProperty( (ScriptableObject) dateValue, "$long" );
				if( longValue != null )
				{
					if( longValue instanceof Number )
						dateTimestamp = ( (Number) longValue ).longValue();
					else
					{
						try
						{
							dateTimestamp = Long.parseLong( longValue.toString() );
						}
						catch( NumberFormatException x )
						{
							throw new RuntimeException( "Invalid $long: " + longValue );
						}
					}
				}
				else
					throw new RuntimeException( "Invalid $date: " + dateValue );
			}
			else
			{
				try
				{
					dateTimestamp = Long.parseLong( dateValue.toString() );
				}
				catch( NumberFormatException x )
				{
					throw new RuntimeException( "Invalid $date: " + dateValue );
				}
			}

			Date date = new Date( dateTimestamp );

			if( javaScript )
				return NativeRhino.to( date );
			else
				return date;
		}

		if( javaScript )
		{
			Object regex = getProperty( scriptable, "$regex" );
			if( regex != null )
			{
				// Convert extended JSON $regex format to Rhino RegExp

				String source = regex.toString();
				Object options = getProperty( scriptable, "$options" );
				String optionsString = "";
				if( options != null )
					optionsString = options.toString();

				return NativeRhino.to( source, optionsString );
			}
		}

		Object oid = getProperty( scriptable, "$oid" );
		if( oid != null )
		{
			// Convert extended JSON $oid format to MongoDB ObjectId

			return new ObjectId( oid.toString() );
		}

		Object binary = getProperty( scriptable, "$binary" );
		if( binary != null )
		{
			// Convert extended JSON $binary format to MongoDB Binary

			Object type = getProperty( scriptable, "$type" );
			byte typeNumber = type != null ? Byte.valueOf( type.toString(), 16 ) : 0;
			byte[] data = Base64.decodeFast( binary.toString() );
			return new Binary( typeNumber, data );
		}

		Object ref = getProperty( scriptable, "$ref" );
		if( ref != null )
		{
			// Convert extended JSON $ref format to MongoDB DBRef

			Object id = getProperty( scriptable, "$id" );
			if( id != null )
			{
				String idString = null;
				if( id instanceof ScriptableObject )
				{
					Object idOid = getProperty( (ScriptableObject) id, "$oid" );
					if( idOid != null )
						idString = idOid.toString();
				}
				if( idString == null )
					idString = id.toString();

				return new DBRefBase( null, ref.toString(), idString );
			}
		}

		return null;
	}

	/**
	 * Converts BSON, byte arrays, java.util.Date, java.util.regex.Pattern,
	 * java.lang.Long, and JavaScript Date and RegExp objects to MongoDB's
	 * extended JSON.
	 * <p>
	 * Note that java.lang.Long will be converted only if necessary in order to
	 * preserve its value when converted to a JavaScript Number object.
	 * <p>
	 * The output can be either a JavaScript object or a java.util.HashMap.
	 * 
	 * @param object
	 * @param javaScript
	 *        True to create JavaScript object, otherwise a java.util.HashMap
	 *        will be used
	 * @return A JavaScript object, a java.util.HashMap or null if not converted
	 */
	public static Object to( Object object, boolean javaScript )
	{
		if( object instanceof Long )
		{
			// Convert Long to extended JSON $long format

			Long longValue = (Long) object;
			String longString = longValue.toString();

			// If the numerical value can be converted to a string via
			// JavaScript without loss of information, then there's no need to
			// convert to extended JSON

			String convertedString = ScriptRuntime.numberToString( longValue, 10 );
			if( longValue.equals( Long.valueOf( convertedString ) ) )
				return null;

			if( javaScript )
			{
				Scriptable nativeObject = NativeRhino.newObject();
				ScriptableObject.putProperty( nativeObject, "$long", longString );
				return nativeObject;
			}
			else
			{
				HashMap<String, String> map = new HashMap<String, String>( 1 );
				map.put( "$long", longString );
				return map;
			}
		}
		if( object instanceof Date )
		{
			// Convert Date to extended JSON $date format

			Scriptable timestamp = NativeRhino.wrap( ( (Date) object ).getTime() );
			if( javaScript )
			{
				Scriptable nativeObject = NativeRhino.newObject();
				ScriptableObject.putProperty( nativeObject, "$date", timestamp );
				return nativeObject;
			}
			else
			{
				HashMap<String, Scriptable> map = new HashMap<String, Scriptable>( 1 );
				map.put( "$date", timestamp );
				return map;
			}
		}
		else if( object instanceof NativeRegExp )
		{
			// Convert NativeRegExp to extended JSON $regex format

			String[] regExp = NativeRhino.from( (NativeRegExp) object );

			if( javaScript )
			{
				Scriptable nativeObject = NativeRhino.newObject();
				ScriptableObject.putProperty( nativeObject, "$regex", regExp[0] );
				ScriptableObject.putProperty( nativeObject, "$options", regExp[1] );
				return nativeObject;
			}
			else
			{
				HashMap<String, String> map = new HashMap<String, String>( 2 );
				map.put( "$regex", regExp[0] );
				map.put( "$options", regExp[1] );
				return map;
			}
		}
		else if( object instanceof ScriptableObject )
		{
			ScriptableObject scriptable = (ScriptableObject) object;
			String className = scriptable.getClassName();
			if( className.equals( "Date" ) )
			{
				// Convert NativeDate to extended JSON $date format

				// (The NativeDate class is private in Rhino, but we can access
				// it like a regular object.)

				Object time = ScriptableObject.callMethod( scriptable, "getTime", null );
				if( time instanceof Number )
				{
					long timestamp = ( (Number) time ).longValue();
					if( javaScript )
					{
						Scriptable nativeObject = NativeRhino.newObject();
						ScriptableObject.putProperty( nativeObject, "$date", timestamp );
						return nativeObject;
					}
					else
					{
						HashMap<String, Long> map = new HashMap<String, Long>( 1 );
						map.put( "$date", timestamp );
						return map;
					}
				}
			}
		}
		else if( object instanceof Pattern )
		{
			// Convert Pattern to extended JSON $regex format

			// (Note: Pattern does not support JavaScript's 'g' option;
			// also, there may be incompatibilities between Pattern's and
			// JavaScript's regular expression implementations)

			Pattern pattern = (Pattern) object;
			String regex = pattern.toString();
			int flags = pattern.flags();
			String options = "";
			if( ( flags & Pattern.CASE_INSENSITIVE ) != 0 )
				options += 'i';
			if( ( flags & Pattern.MULTILINE ) != 0 )
				options += 'm';

			if( javaScript )
			{
				Scriptable nativeObject = NativeRhino.newObject();
				ScriptableObject.putProperty( nativeObject, "$regex", regex );
				ScriptableObject.putProperty( nativeObject, "$options", options );
				return nativeObject;
			}
			else
			{
				HashMap<String, String> map = new HashMap<String, String>( 2 );
				map.put( "$regex", regex );
				map.put( "$options", options );
				return map;
			}
		}
		else if( object instanceof ObjectId )
		{
			// Convert MongoDB ObjectId to extended JSON $oid format

			String oid = ( (ObjectId) object ).toStringMongod();
			if( javaScript )
			{
				Scriptable nativeObject = NativeRhino.newObject();
				ScriptableObject.putProperty( nativeObject, "$oid", oid );
				return nativeObject;
			}
			else
			{
				HashMap<String, String> map = new HashMap<String, String>( 1 );
				map.put( "$oid", ( (ObjectId) object ).toStringMongod() );
				return map;
			}
		}
		else if( object instanceof Binary )
		{
			// Convert MongoDB Binary to extended JSON $binary format

			Binary binary = (Binary) object;
			String data = Base64.encodeToString( binary.getData(), false );
			String type = Integer.toHexString( binary.getType() );
			if( javaScript )
			{
				Scriptable nativeObject = NativeRhino.newObject();
				ScriptableObject.putProperty( nativeObject, "$binary", data );
				ScriptableObject.putProperty( nativeObject, "$type", type );
				return nativeObject;
			}
			else
			{
				HashMap<String, String> map = new HashMap<String, String>( 2 );
				map.put( "$binary", data );
				map.put( "$type", type );
				return map;
			}
		}
		else if( object instanceof byte[] )
		{
			// Convert byte array to extended JSON $binary format

			byte[] bytes = (byte[]) object;
			String data = Base64.encodeToString( bytes, false );
			String type = Integer.toHexString( 0 );
			if( javaScript )
			{
				Scriptable nativeObject = NativeRhino.newObject();
				ScriptableObject.putProperty( nativeObject, "$binary", data );
				ScriptableObject.putProperty( nativeObject, "$type", type );
				return nativeObject;
			}
			else
			{
				HashMap<String, String> map = new HashMap<String, String>( 2 );
				map.put( "$binary", data );
				map.put( "$type", type );
				return map;
			}
		}
		else if( object instanceof DBRefBase )
		{
			// Convert MongoDB ref to extended JSON $ref format

			DBRefBase ref = (DBRefBase) object;
			String collection = ref.getRef();
			Object id = BSON.from( ref.getId(), true );
			String idString;
			if( id instanceof ObjectId )
				idString = ( (ObjectId) id ).toStringMongod();
			else
				// Seems like this will break for aggregate _ids, but this is
				// what the MongoDB documentation says!
				idString = id.toString();

			if( javaScript )
			{
				Scriptable nativeObject = NativeRhino.newObject();
				ScriptableObject.putProperty( nativeObject, "$ref", collection );
				ScriptableObject.putProperty( nativeObject, "$id", idString );
				return nativeObject;
			}
			else
			{
				HashMap<String, String> map = new HashMap<String, String>( 2 );
				map.put( "$ref", collection );
				map.put( "$id", idString );
				return map;
			}
		}

		return null;
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	private static Object getProperty( ScriptableObject scriptable, String key )
	{
		Object object = ScriptableObject.getProperty( scriptable, key );
		if( object != Scriptable.NOT_FOUND )
		{
			// Unwrap
			while( object instanceof NativeJavaObject )
				object = ( (NativeJavaObject) object ).unwrap();

			return object;
		}

		return null;
	}
}
