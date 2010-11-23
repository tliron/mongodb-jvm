/**
 * Copyright 2010 Three Crickets LLC.
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
import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.regexp.NativeRegExp;

import com.mongodb.DBRefBase;
import com.mongodb.rhino.util.Base64;

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
	 * Converts JavaScript objects adhering to MongoDB's extended JSON to BSON
	 * types: {$oid:'objectid'}, {$binary:'base64',$type:'hex'},
	 * {$ref:'collection',$id:'objectid'}.
	 * <p>
	 * The {$date:timestamp} extended JSON format can be converted to either a
	 * JavaScript Date object or a java.util.Date object.
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
		Object date = ScriptableObject.getProperty( scriptable, "$date" );
		if( date != Scriptable.NOT_FOUND )
		{
			if( javaScript )
			{
				// Convert extended JSON $date format to Rhino date

				// (The NativeDate class is private in Rhino, but we can access
				// it like a regular object.)

				Context context = Context.getCurrentContext();
				Scriptable scope = ScriptRuntime.getTopCallScope( context );
				Scriptable nativeDate = context.newObject( scope, "Date", new Object[]
				{
					date
				} );

				return nativeDate;
			}
			else
			{
				// Convert extended JSON $date format to JVM Date

				long dateTimestamp;
				if( date instanceof Number )
					dateTimestamp = ( (Number) date ).longValue();
				else
					// Fallback to string conversion, just in case
					dateTimestamp = Long.parseLong( date.toString() );
				return new Date( dateTimestamp );
			}
		}

		Object regex = ScriptableObject.getProperty( scriptable, "$regex" );
		if( regex != Scriptable.NOT_FOUND )
		{
			// Convert extended JSON $regex format to Rhino RegExp

			String source = regex.toString();
			Object options = ScriptableObject.getProperty( scriptable, "$options" );
			String optionsString = "";
			if( options != Scriptable.NOT_FOUND )
				optionsString = options.toString();

			Context context = Context.getCurrentContext();
			Scriptable scope = ScriptRuntime.getTopCallScope( context );
			Scriptable nativeRegExp = context.newObject( scope, "RegExp", new Object[]
			{
				source, optionsString
			} );

			return nativeRegExp;
		}

		Object oid = ScriptableObject.getProperty( scriptable, "$oid" );
		if( oid != Scriptable.NOT_FOUND )
		{
			// Convert extended JSON $oid format to MongoDB ObjectId

			return new ObjectId( oid.toString() );
		}

		Object binary = ScriptableObject.getProperty( scriptable, "$binary" );
		if( binary != Scriptable.NOT_FOUND )
		{
			// Convert extended JSON $binary format to MongoDB Binary

			Object type = ScriptableObject.getProperty( scriptable, "$type" );
			byte typeNumber = Byte.valueOf( type.toString(), 16 );
			byte[] data = Base64.decodeFast( binary.toString() );
			return new Binary( typeNumber, data );
		}

		Object ref = ScriptableObject.getProperty( scriptable, "$ref" );
		if( ref != Scriptable.NOT_FOUND )
		{
			// Convert extended JSON $ref format to MongoDB DBRef

			Object id = ScriptableObject.getProperty( scriptable, "$id" );
			if( id != Scriptable.NOT_FOUND )
			{
				String idString = null;
				if( id instanceof ScriptableObject )
				{
					Object idOid = ScriptableObject.getProperty( (ScriptableObject) id, "$oid" );
					if( idOid != Scriptable.NOT_FOUND )
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
	 * Converts BSON, java.util.Date, java.util.regex.Pattern, and JavaScript
	 * Date and RegExp objects to MongoDB's extended JSON.
	 * <p>
	 * The output can be either a JavaScript object or a java.util.HashMap.
	 * 
	 * @param object
	 * @param javaScript
	 *        True to create JavaScript object, otherwise a java.util.HashMap
	 *        will be used
	 * @return A JavaScript object, a java.util.HashMap or null
	 */
	public static Object to( Object object, boolean javaScript )
	{
		if( object instanceof Date )
		{
			// Convert Date to extended JSON $date format

			long timestamp = ( (Date) object ).getTime();
			if( javaScript )
			{
				NativeObject nativeObject = new NativeObject();
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
		else if( object instanceof NativeRegExp )
		{
			// Convert NativeRegExp to extended JSON $regex format

			NativeRegExp regExp = (NativeRegExp) object;
			String regex = ScriptableObject.getProperty( regExp, "source" ).toString();
			Object isGlobal = ScriptableObject.getProperty( regExp, "global" );
			Object isIgnoreCase = ScriptableObject.getProperty( regExp, "ignoreCase" );
			Object isMultiLine = ScriptableObject.getProperty( regExp, "multiline" );
			String options = "";
			if( ( isGlobal instanceof Boolean ) && ( ( (Boolean) isGlobal ).booleanValue() ) )
				options += "g";
			if( ( isIgnoreCase instanceof Boolean ) && ( ( (Boolean) isIgnoreCase ).booleanValue() ) )
				options += "i";
			if( ( isMultiLine instanceof Boolean ) && ( ( (Boolean) isMultiLine ).booleanValue() ) )
				options += "m";

			if( javaScript )
			{
				NativeObject nativeObject = new NativeObject();
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
		else if( object instanceof ScriptableObject )
		{
			ScriptableObject scriptable = (ScriptableObject) object;
			String className = scriptable.getClassName();
			if( className.equals( "Date" ) )
			{
				// (The NativeDate class is private in Rhino, but we can access
				// it like a regular object.)

				Object time = ScriptableObject.callMethod( scriptable, "getTime", null );
				if( time instanceof Number )
				{
					long timestamp = ( (Number) time ).longValue();
					if( javaScript )
					{
						NativeObject nativeObject = new NativeObject();
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

			Pattern pattern = (Pattern) object;
			String regex = pattern.toString();
			int flags = pattern.flags();
			String options = "";
			if( ( flags & Pattern.CASE_INSENSITIVE ) != 0 )
				options += 'i';
			if( ( flags & Pattern.MULTILINE ) != 0 )
				options += 'm';
			// TODO: unclear how to handle the JavaScript global flag from JVM
			// pattern

			if( javaScript )
			{
				NativeObject nativeObject = new NativeObject();
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
				NativeObject nativeObject = new NativeObject();
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
				NativeObject nativeObject = new NativeObject();
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
				NativeObject nativeObject = new NativeObject();
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
}
