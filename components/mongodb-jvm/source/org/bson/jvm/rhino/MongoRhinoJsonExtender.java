/**
 * Copyright 2010-2015 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package org.bson.jvm.rhino;

import java.util.Date;
import java.util.HashMap;
import java.util.regex.Pattern;

import org.bson.BsonTimestamp;
import org.bson.jvm.internal.Base64;
import org.bson.types.BSONTimestamp;
import org.bson.types.Binary;
import org.bson.types.ObjectId;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.NativeJavaObject;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.mozilla.javascript.regexp.NativeRegExp;

import com.mongodb.DBRef;
import com.threecrickets.jvm.json.rhino.RhinoJsonExtenderOld;
import com.threecrickets.jvm.json.rhino.util.RhinoNativeUtil;
import com.threecrickets.jvm.json.util.JsonUtil;
import com.threecrickets.jvm.json.util.Literal;

/**
 * Conversion between native Rhino values and
 * <a href="http://docs.mongodb.org/manual/reference/mongodb-extended-json/" >
 * MongoDB's extended JSON notation</a>.
 * <p>
 * Notations converted to org.bson.types: {$oid:'objectid'},
 * {$binary:'base64',$type:'hex'}, {$ref:'collection',$id:'objectid'}.
 * <p>
 * Native conversions: {$undefined:true} for {@link Undefined},
 * {$date:timestamp} and {$timestamp:{t:seconds,i:inc}} for
 * org.mozilla.javascript.NativeDate, and {$regex:'pattern',$options:'options'}
 * for {@link NativeRegExp}. When the "rhino" argument is true in
 * {@link #from(ScriptableObject, boolean)}, JVM values will be used instead:
 * {@link Date}, {@link BSONTimestamp}, {@link Pattern}. These values are also
 * recognized in {@link #to(Object, boolean, boolean)}.
 * <p>
 * We also supports two additional extended notations, not defined by MongoDB:
 * <p>
 * {$function:'source'} for {@link Function}.
 * <p>
 * {$long:'integer'} for {@link Long} and {$integer:'integer'} for
 * {@link Integer}. This string-based encoding is necessary for preserving
 * precision, because JavaScript only supports double values for numbers. Note
 * that the implementation makes sure to create a {@link Long} only if indeed
 * precision would be lost without it.
 * <p>
 * Also converts JVM byte arrays to {@link Binary}.
 * 
 * @author Tal Liron
 */
public class MongoRhinoJsonExtender implements RhinoJsonExtenderOld
{
	//
	// RhinoJsonExtender
	//

	public Object from( ScriptableObject scriptableObject, boolean rhino )
	{
		Object longValue = getProperty( scriptableObject, "$long" );
		if( longValue != null )
		{
			// Convert extended JSON $long format to Long

			if( longValue instanceof Number )
				return RhinoNativeUtil.wrap( ( (Number) longValue ).longValue() );
			else
			{
				try
				{
					return RhinoNativeUtil.wrap( Long.parseLong( longValue.toString() ) );
				}
				catch( NumberFormatException x )
				{
					throw new RuntimeException( "Invalid $long: " + longValue );
				}
			}
		}

		Object integerValue = getProperty( scriptableObject, "$integer" );
		if( integerValue != null )
		{
			// Convert extended JSON $integer format to Integer

			if( integerValue instanceof Number )
				return RhinoNativeUtil.wrap( ( (Number) integerValue ).intValue() );
			else
			{
				try
				{
					return RhinoNativeUtil.wrap( Integer.parseInt( integerValue.toString() ) );
				}
				catch( NumberFormatException x )
				{
					throw new RuntimeException( "Invalid $integer: " + integerValue );
				}
			}
		}

		Object undefined = getProperty( scriptableObject, "$undefined" );
		if( undefined != null )
		{
			// Convert extended JSON $undefined format to JavaScript undefined

			return Undefined.instance;
		}

		Object functionValue = getProperty( scriptableObject, "$function" );
		if( functionValue != null )
		{
			// Convert extended JSON $function format to JavaScript function

			return RhinoNativeUtil.toFunction( functionValue );
		}

		Object dateValue = getProperty( scriptableObject, "$date" );
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

			if( rhino )
				return RhinoNativeUtil.to( date );
			else
				return date;
		}

		Object timestampValue = getProperty( scriptableObject, "$timestamp" );
		if( timestampValue != null )
		{
			// Convert extended JSON $timestamp format to MongoDB BSONTimestamp
			// or Rhino date

			int t, i;

			if( timestampValue instanceof ScriptableObject )
			{
				Object tValue = getProperty( (ScriptableObject) timestampValue, "t" );
				Object iValue = getProperty( (ScriptableObject) timestampValue, "i" );

				if( ( tValue instanceof Number ) && ( iValue instanceof Number ) )
				{
					t = ( (Number) tValue ).intValue();
					i = ( (Number) iValue ).intValue();
				}
				else
					throw new RuntimeException( "Invalid $timestamp: " + timestampValue );
			}
			else
				throw new RuntimeException( "Invalid $timestamp: " + timestampValue );

			BSONTimestamp timestamp = new BSONTimestamp( t, i );

			if( rhino )
				return RhinoNativeUtil.to( new Date( timestamp.getTime() * 1000L ) );
			else
				return timestamp;
		}

		if( rhino )
		{
			Object regex = getProperty( scriptableObject, "$regex" );
			if( regex != null )
			{
				// Convert extended JSON $regex format to Rhino RegExp

				String source = regex.toString();
				Object options = getProperty( scriptableObject, "$options" );
				String optionsString = "";
				if( options != null )
					optionsString = options.toString();

				return RhinoNativeUtil.toRegExp( source, optionsString );
			}
		}

		Object oid = getProperty( scriptableObject, "$oid" );
		if( oid != null )
		{
			// Convert extended JSON $oid format to MongoDB ObjectId

			return new ObjectId( oid.toString() );
		}

		Object binary = getProperty( scriptableObject, "$binary" );
		if( binary != null )
		{
			// Convert extended JSON $binary format to MongoDB Binary

			Object type = getProperty( scriptableObject, "$type" );
			byte typeNumber = type != null ? Byte.valueOf( type.toString(), 16 ) : 0;
			byte[] data = Base64.decodeFast( binary.toString() );
			return new Binary( typeNumber, data );
		}

		Object ref = getProperty( scriptableObject, "$ref" );
		if( ref != null )
		{
			// Convert extended JSON $ref format to MongoDB DBRef

			Object id = getProperty( scriptableObject, "$id" );
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

				return new DBRef( ref.toString(), idString );
			}
		}

		return null;
	}

	public Object to( Object object, boolean rhino, boolean javaScript )
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

			if( rhino )
			{
				Scriptable scriptableObject = RhinoNativeUtil.newObject();
				ScriptableObject.putProperty( scriptableObject, "$long", longString );
				return scriptableObject;
			}
			else
			{
				HashMap<String, String> map = new HashMap<String, String>( 1 );
				map.put( "$long", longString );
				return map;
			}
		}
		else if( object instanceof Date )
		{
			// Convert Date to extended JSON $date format

			long time = ( (Date) object ).getTime();
			if( javaScript )
			{
				return new Literal( "new Date(" + ScriptRuntime.numberToString( time, 10 ) + ")" );
			}
			else if( rhino )
			{
				Scriptable scriptableObject = RhinoNativeUtil.newObject();
				ScriptableObject.putProperty( scriptableObject, "$date", RhinoNativeUtil.wrap( time ) );
				return scriptableObject;
			}
			else
			{
				HashMap<String, Long> map = new HashMap<String, Long>( 1 );
				map.put( "$date", time );
				return map;
			}
		}
		else if( object instanceof NativeRegExp )
		{
			// Convert NativeRegExp to extended JSON $regex format

			String[] regExp = RhinoNativeUtil.from( (NativeRegExp) object );

			if( javaScript )
			{
				if( ( regExp[1] != null ) && ( regExp[1].length() > 0 ) )
					return new Literal( "new RegExp(\"" + JsonUtil.escape( regExp[0] ) + "\", \"" + JsonUtil.escape( regExp[1] ) + "\")" );
				else
					return new Literal( "new RegExp(\"" + JsonUtil.escape( regExp[0] ) + "\")" );
			}
			else if( rhino )
			{
				Scriptable scriptableObject = RhinoNativeUtil.newObject();
				ScriptableObject.putProperty( scriptableObject, "$regex", regExp[0] );
				ScriptableObject.putProperty( scriptableObject, "$options", regExp[1] );
				return scriptableObject;
			}
			else
			{
				HashMap<String, String> map = new HashMap<String, String>( 2 );
				map.put( "$regex", regExp[0] );
				map.put( "$options", regExp[1] );
				return map;
			}
		}
		else if( object instanceof Function )
		{
			// Convert Function to extended JSON $function format

			String source = ScriptRuntime.toString( object ).trim();

			if( javaScript )
			{
				return new Literal( source );
			}
			else if( rhino )
			{
				Scriptable scriptableObject = RhinoNativeUtil.newObject();
				ScriptableObject.putProperty( scriptableObject, "$function", source );
				return scriptableObject;
			}
			else
			{
				HashMap<String, String> map = new HashMap<String, String>( 1 );
				map.put( "$function", source );
				return map;
			}
		}
		else if( object instanceof ScriptableObject )
		{
			ScriptableObject scriptableObject = (ScriptableObject) object;
			String className = scriptableObject.getClassName();
			if( className.equals( "Date" ) )
			{
				// Convert NativeDate to extended JSON $date format

				// (The NativeDate class is private in Rhino, but we can access
				// it like a regular object.)

				Object time = ScriptableObject.callMethod( scriptableObject, "getTime", null );
				if( time instanceof Number )
				{
					long timestamp = ( (Number) time ).longValue();
					if( rhino )
					{
						Scriptable dateScriptableObject = RhinoNativeUtil.newObject();
						ScriptableObject.putProperty( dateScriptableObject, "$date", timestamp );
						return dateScriptableObject;
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
				if( options.length() > 0 )
					return new Literal( "new RegExp(\"" + JsonUtil.escape( regex ) + "\", \"" + JsonUtil.escape( options ) + "\")" );
				else
					return new Literal( "new RegExp(\"" + JsonUtil.escape( regex ) + "\")" );
			}
			else if( rhino )
			{
				Scriptable scriptableObject = RhinoNativeUtil.newObject();
				ScriptableObject.putProperty( scriptableObject, "$regex", regex );
				ScriptableObject.putProperty( scriptableObject, "$options", options );
				return scriptableObject;
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

			String oid = ( (ObjectId) object ).toHexString();
			if( rhino )
			{
				Scriptable scriptableObject = RhinoNativeUtil.newObject();
				ScriptableObject.putProperty( scriptableObject, "$oid", oid );
				return scriptableObject;
			}
			else
			{
				HashMap<String, String> map = new HashMap<String, String>( 1 );
				map.put( "$oid", ( (ObjectId) object ).toHexString() );
				return map;
			}
		}
		else if( object instanceof Binary )
		{
			// Convert MongoDB Binary to extended JSON $binary format

			Binary binary = (Binary) object;
			String data = Base64.encodeToString( binary.getData(), false );
			String type = Integer.toHexString( binary.getType() );
			if( rhino )
			{
				Scriptable scriptableObject = RhinoNativeUtil.newObject();
				ScriptableObject.putProperty( scriptableObject, "$binary", data );
				ScriptableObject.putProperty( scriptableObject, "$type", type );
				return scriptableObject;
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
			if( rhino )
			{
				Scriptable scriptableObject = RhinoNativeUtil.newObject();
				ScriptableObject.putProperty( scriptableObject, "$binary", data );
				ScriptableObject.putProperty( scriptableObject, "$type", type );
				return scriptableObject;
			}
			else
			{
				HashMap<String, String> map = new HashMap<String, String>( 2 );
				map.put( "$binary", data );
				map.put( "$type", type );
				return map;
			}
		}
		else if( object instanceof DBRef )
		{
			// Convert MongoDB ref to extended JSON $ref format

			DBRef ref = (DBRef) object;
			String collection = ref.getCollectionName();
			Object id = ref.getId();
			String idString;
			if( id instanceof ObjectId )
				idString = ( (ObjectId) id ).toHexString();
			else
				// Seems like this will break for aggregate _ids, but this is
				// what the MongoDB documentation says!
				idString = id.toString();

			if( rhino )
			{
				Scriptable scriptableObject = RhinoNativeUtil.newObject();
				ScriptableObject.putProperty( scriptableObject, "$ref", collection );
				ScriptableObject.putProperty( scriptableObject, "$id", idString );
				return scriptableObject;
			}
			else
			{
				HashMap<String, String> map = new HashMap<String, String>( 2 );
				map.put( "$ref", collection );
				map.put( "$id", idString );
				return map;
			}
		}
		else if( object instanceof BsonTimestamp )
		{
			// Convert MongoDB BSONTimestamp to extended JSON $timestamp format

			BsonTimestamp timestamp = (BsonTimestamp) object;
			int t = timestamp.getTime();
			int i = timestamp.getInc();

			if( rhino )
			{
				Scriptable scriptableObject = RhinoNativeUtil.newObject();
				ScriptableObject.putProperty( scriptableObject, "t", t );
				ScriptableObject.putProperty( scriptableObject, "i", i );
				return scriptableObject;
			}
			else
			{
				HashMap<String, Integer> map = new HashMap<String, Integer>( 2 );
				map.put( "t", t );
				map.put( "i", i );
				return map;
			}
		}

		return null;
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	private static Object getProperty( ScriptableObject scriptableObject, String key )
	{
		Object object = ScriptableObject.getProperty( scriptableObject, key );
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
