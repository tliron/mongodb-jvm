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

import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.regex.Pattern;

import org.bson.types.Binary;
import org.bson.types.ObjectId;
import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.NativeJavaObject;
import org.mozilla.javascript.ScriptableObject;

import com.mongodb.DBRefBase;
import com.mongodb.rhino.util.Base64;
import com.mongodb.rhino.util.JSONException;
import com.mongodb.rhino.util.JSONTokener;

/**
 * Direct conversion between native Rhino objects and JSON.
 * <p>
 * This class can be used directly in Rhino.
 * 
 * @author Tal Liron
 */
public class JSON
{
	//
	// Static operations
	//

	/**
	 * Recursively convert from JSON into native JavaScript types.
	 * <p>
	 * Creates JavaScript objects, arrays and primitives.
	 * 
	 * @param json
	 *        The JSON string
	 * @return A JavaScript object or array
	 * @throws JSONException
	 */
	public static Object from( String json ) throws JSONException
	{
		return from( json, false );
	}

	/**
	 * Recursively convert from JSON into native JavaScript types.
	 * <p>
	 * Creates JavaScript objects, arrays and primitives.
	 * <p>
	 * Can optionally recognize MongoDB's extended JSON: {$oid:'objectid'},
	 * {$binary:'base64',$type:'hex'}, {$ref:'collection',$id:'objectid'},
	 * {$date:timestamp}.
	 * 
	 * @param json
	 *        The JSON string
	 * @param extendedJSON
	 *        Whether to convert special "$" objects
	 * @return A JavaScript object or array
	 * @throws JSONException
	 */
	public static Object from( String json, boolean extendedJSON ) throws JSONException
	{
		JSONTokener tokener = new JSONTokener( json );
		Object object = tokener.createNative();
		if( extendedJSON )
			object = fromExtendedJSON( object );
		return object;
	}

	/**
	 * Recursively convert from native JavaScript, a few JVM types and BSON
	 * types to extended JSON.
	 * <p>
	 * Recognizes JavaScript objects, arrays, dates and primitives.
	 * <p>
	 * Recognizes JVM types: java.util.Map, java.util.Collection,
	 * java.util.Date.
	 * <p>
	 * Recognizes BSON types: ObjectId, Binary and DBRef.
	 * 
	 * @param object
	 *        A native JavaScript object
	 * @return The JSON string
	 * @see #fromExtendedJSON(Object)
	 */
	public static String to( Object object )
	{
		return to( object, false );
	}

	/**
	 * Recursively convert from native JavaScript, a few JVM types and BSON
	 * types to extended JSON.
	 * <p>
	 * Recognizes JavaScript objects, arrays, dates and primitives.
	 * <p>
	 * Recognizes JVM types: java.util.Map, java.util.Collection,
	 * java.util.Date.
	 * <p>
	 * Recognizes BSON types: ObjectId, Binary and DBRef.
	 * 
	 * @param object
	 *        A native JavaScript object
	 * @param indent
	 *        Whether to indent the JSON for human readability
	 * @return The JSON string
	 * @see #fromExtendedJSON(Object)
	 */
	public static String to( Object object, boolean indent )
	{
		StringBuilder s = new StringBuilder();
		encode( s, object, indent, indent ? 0 : -1 );
		return s.toString();
	}

	/**
	 * Recursively converts MongoDB's extended JSON to native JavaScript or
	 * native BSON types.
	 * <p>
	 * Converts {$date:timestamp} objects to JavaScript date objects.
	 * <p>
	 * The following BSON types are supported: {$oid:'objectid'},
	 * {$binary:'base64',$type:'hex'}, {$ref:'collection',$id:'objectid'}.
	 * 
	 * @param object
	 *        A native JavaScript object or array
	 * @return The converted object or the original
	 * @see ExtendedJSON#fromExtendedJSON(ScriptableObject, boolean)
	 */
	public static Object fromExtendedJSON( Object object )
	{
		if( object instanceof NativeArray )
		{
			NativeArray array = (NativeArray) object;
			int length = (int) array.getLength();

			for( int i = 0; i < length; i++ )
			{
				Object value = ScriptableObject.getProperty( array, i );
				Object converted = fromExtendedJSON( value );
				if( converted != value )
					ScriptableObject.putProperty( array, i, converted );
			}
		}
		else if( object instanceof ScriptableObject )
		{
			ScriptableObject scriptable = (ScriptableObject) object;

			Object r = ExtendedJSON.fromExtendedJSON( scriptable, true );
			if( r != null )
				return r;

			// Convert regular Rhino object

			Object[] ids = scriptable.getAllIds();
			for( Object id : ids )
			{
				String key = id.toString();
				Object value = ScriptableObject.getProperty( scriptable, key );
				Object converted = fromExtendedJSON( value );
				if( converted != value )
					ScriptableObject.putProperty( scriptable, key, converted );
			}
		}

		return object;
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	private static void encode( StringBuilder s, Object object, boolean indent, int depth )
	{
		if( indent )
			indent( s, depth );

		if( object == null )
		{
			s.append( "null" );
		}
		else if( object instanceof Number )
		{
			s.append( object );
		}
		else if( object instanceof Boolean )
		{
			s.append( object );
		}
		else if( object instanceof Date )
		{
			HashMap<String, Long> map = new HashMap<String, Long>();
			map.put( "$date", ( (Date) object ).getTime() );
			encode( s, map, depth );
		}
		else if( object instanceof ObjectId )
		{
			HashMap<String, String> map = new HashMap<String, String>();
			map.put( "$oid", ( (ObjectId) object ).toStringMongod() );
			encode( s, map, depth );
		}
		else if( object instanceof Binary )
		{
			Binary binary = (Binary) object;
			HashMap<String, String> map = new HashMap<String, String>();
			map.put( "$binary", Base64.encodeToString( binary.getData(), false ) );
			map.put( "$type", Integer.toHexString( binary.getType() ) );
			encode( s, map, depth );
		}
		else if( object instanceof DBRefBase )
		{
			HashMap<String, String> map = new HashMap<String, String>();
			DBRefBase ref = (DBRefBase) object;
			map.put( "$ref", ref.getRef() );

			Object id = BSON.from( ref.getId(), true );
			if( id instanceof ObjectId )
				map.put( "$id", ( (ObjectId) id ).toStringMongod() );
			else
				// Seems like this will break for aggregate _ids, but this is
				// what the MongoDB documentation says!
				map.put( "$id", id.toString() );

			encode( s, map, depth );
		}
		else if( object instanceof NativeJavaObject )
		{
			// This happens either because the developer purposely creates a
			// Java object, or because it was returned from a Java call and
			// wrapped by Rhino.

			encode( s, ( (NativeJavaObject) object ).unwrap(), false, depth );
		}
		else if( object instanceof Collection )
		{
			encode( s, (Collection<?>) object, depth );
		}
		else if( object instanceof Map )
		{
			encode( s, (Map<?, ?>) object, depth );
		}
		else if( object instanceof NativeArray )
		{
			encode( s, (NativeArray) object, depth );
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
					encode( s, new Date( ( (Number) time ).longValue() ), false, depth );
					return;
				}
			}
			else if( className.equals( "String" ) )
			{
				// Unpack NativeString

				s.append( '\"' );
				s.append( escape( object.toString() ) );
				s.append( '\"' );
			}
			else
			{
				encode( s, scriptable, depth );
			}
		}
		else
		{
			s.append( '\"' );
			s.append( escape( object.toString() ) );
			s.append( '\"' );
		}
	}

	private static void encode( StringBuilder s, Collection<?> collection, int depth )
	{
		s.append( '[' );

		Iterator<?> i = collection.iterator();
		if( i.hasNext() )
		{
			if( depth > -1 )
				s.append( '\n' );

			while( true )
			{
				Object value = i.next();

				encode( s, value, true, depth > -1 ? depth + 1 : -1 );

				if( i.hasNext() )
				{
					s.append( ',' );
					if( depth > -1 )
						s.append( '\n' );
				}
				else
					break;
			}

			if( depth > -1 )
			{
				s.append( '\n' );
				indent( s, depth );
			}
		}

		s.append( ']' );
	}

	private static void encode( StringBuilder s, Map<?, ?> map, int depth )
	{
		s.append( '{' );

		Iterator<?> i = map.entrySet().iterator();
		if( i.hasNext() )
		{
			if( depth > -1 )
				s.append( '\n' );

			while( true )
			{
				Map.Entry<?, ?> entry = (Map.Entry<?, ?>) i.next();
				String key = entry.getKey().toString();
				Object value = entry.getValue();

				if( depth > -1 )
					indent( s, depth + 1 );

				s.append( '\"' );
				s.append( escape( key ) );
				s.append( "\":" );

				if( depth > -1 )
					s.append( ' ' );

				encode( s, value, false, depth > -1 ? depth + 1 : -1 );

				if( i.hasNext() )
				{
					s.append( ',' );
					if( depth > -1 )
						s.append( '\n' );
				}
				else
					break;
			}

			if( depth > -1 )
			{
				s.append( '\n' );
				indent( s, depth );
			}
		}

		s.append( '}' );
	}

	private static void encode( StringBuilder s, NativeArray array, int depth )
	{
		s.append( '[' );

		long length = array.getLength();
		if( length > 0 )
		{
			if( depth > -1 )
				s.append( '\n' );

			for( int i = 0; i < length; i++ )
			{
				Object value = ScriptableObject.getProperty( array, i );

				encode( s, value, true, depth > -1 ? depth + 1 : -1 );

				if( i < length - 1 )
				{
					s.append( ',' );
					if( depth > -1 )
						s.append( '\n' );
				}
			}

			if( depth > -1 )
			{
				s.append( '\n' );
				indent( s, depth );
			}
		}

		s.append( ']' );
	}

	private static void encode( StringBuilder s, ScriptableObject object, int depth )
	{
		s.append( '{' );

		Object[] ids = object.getAllIds();
		int length = ids.length;
		if( length > 0 )
		{
			if( depth > -1 )
				s.append( '\n' );

			for( int i = 0; i < length; i++ )
			{
				String key = ids[i].toString();
				Object value = ScriptableObject.getProperty( object, key );

				if( depth > -1 )
					indent( s, depth + 1 );

				s.append( '\"' );
				s.append( escape( key ) );
				s.append( "\":" );

				if( depth > -1 )
					s.append( ' ' );

				encode( s, value, false, depth > -1 ? depth + 1 : -1 );

				if( i < length - 1 )
				{
					s.append( ',' );
					if( depth > -1 )
						s.append( '\n' );
				}
			}

			if( depth > -1 )
			{
				s.append( '\n' );
				indent( s, depth );
			}
		}

		s.append( '}' );
	}

	private static void indent( StringBuilder s, int depth )
	{
		for( int i = depth - 1; i >= 0; i-- )
			s.append( "  " );
	}

	private static Pattern[] ESCAPE_PATTERNS = new Pattern[]
	{
		Pattern.compile( "\\\\" ), Pattern.compile( "\\n" ), Pattern.compile( "\\r" ), Pattern.compile( "\\t" ), Pattern.compile( "\\f" ), Pattern.compile( "\\\"" )
	};

	private static String[] ESCAPE_REPLACEMENTS = new String[]
	{
		"\\\\\\", "\\\\n", "\\\\r", "\\\\t", "\\\\f", "\\\\\""
	};

	private static String escape( String string )
	{
		for( int i = 0, length = ESCAPE_PATTERNS.length; i < length; i++ )
			string = ESCAPE_PATTERNS[i].matcher( string ).replaceAll( ESCAPE_REPLACEMENTS[i] );
		return string;
	}
}
